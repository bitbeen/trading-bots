// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol'; //import interface for flash call back to overwrite later
import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';

import '@uniswap/v3-periphery/contracts/base/PeripheryPayments.sol';
import '@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol';
import '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol';
import '@uniswap/v3-periphery/contracts/libraries/CallbackValidation.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
//overring flash allowing us to inject logic allowing us to make trades into the content of the regular flash function
//runs 
//check liquidity in the pool
//calculate fees owed
//transfer funds
//run swap logic 
//use funds to make swaps in other pools and pay back 


contract PairFlash is IUniswapV3FlashCallback, PeripheryImmutableState, PeripheryPayments {
    using LowGasSafeMath for uint256; //this is where .add and other maths opps comee from
    using LowGasSafeMath for int256;

    ISwapRouter public immutable swapRouter;
    //sets contract addresses an other important data
    constructor(
        ISwapRouter _swapRouter,
        address _factory,
        address _WETH9
    ) PeripheryImmutableState(_factory, _WETH9) {
        swapRouter = _swapRouter;
    }

    function uniswapV3FlashCallback( //override the flashcall back function 
        uint256 fee0, //fees owed on token 0 borrowed
        uint256 fee1, //fees owed on token 1 borrowed
        bytes calldata data //what ever data required to the flash function
    ) external override {
        FlashCallbackData memory decoded = abi.decode(data, (FlashCallbackData)); //checks pool called is really a V3 pool
        CallbackValidation.verifyCallback(factory, decoded.poolKey);

        address token0 = decoded.poolKey.token0; //get token 0 and token 1 from the pool key we passed in
        address token1 = decoded.poolKey.token1;

        TransferHelper.safeApprove(token0, address(swapRouter), decoded.amount0);//approve swap router to use tokens that we got from the flash loan
        TransferHelper.safeApprove(token1, address(swapRouter), decoded.amount1);

        uint256 amount1Min = LowGasSafeMath.add(decoded.amount1, fee1); //calculate mimum we need to get out of swap to make arbitrage profitable
        uint256 amount0Min = LowGasSafeMath.add(decoded.amount0, fee0);
        //if the swap won't make us atleast this amount it's not worth doing 

        //run our swap on first pool - pass in params
        //to make money we want token0 to have more value in this pool relative to the pool we borrowed money from 
        uint256 amountOut0 =
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token1,
                    tokenOut: token0,
                    fee: decoded.poolFee2,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: decoded.amount1,
                    amountOutMinimum: amount0Min, //swap wont go through unless it returns atleast that amount
                    sqrtPriceLimitX96: 0
                })
            );
        //to make money we want token0 to have more value in this pool relative to the pool we borrowed money from 
        uint256 amountOut1 =
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token0,
                    tokenOut: token1,
                    fee: decoded.poolFee3,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: decoded.amount0,
                    amountOutMinimum: amount1Min,
                    sqrtPriceLimitX96: 0
                })
            );
        //this is just a tester 
        //it can be up to 5 pools 
        //it can also be different tokens being swapped
        //just need to make sure it's instant and you have more at the end of the original tokens started plus fees
        uint256 amount0Owed = LowGasSafeMath.add(decoded.amount0, fee0);
        uint256 amount1Owed = LowGasSafeMath.add(decoded.amount1, fee1);

        TransferHelper.safeApprove(token0, address(this), amount0Owed);
        TransferHelper.safeApprove(token1, address(this), amount1Owed);

        if (amount0Owed > 0) pay(token0, address(this), msg.sender, amount0Owed);
        if (amount1Owed > 0) pay(token1, address(this), msg.sender, amount1Owed);

        if (amountOut0 > amount0Owed) {
            uint256 profit0 = LowGasSafeMath.sub(amountOut0, amount0Owed);

            TransferHelper.safeApprove(token0, address(this), profit0);
            pay(token0, address(this), decoded.payer, profit0);
        }
        if (amountOut1 > amount1Owed) {
            uint256 profit1 = LowGasSafeMath.sub(amountOut1, amount1Owed);
            TransferHelper.safeApprove(token0, address(this), profit1);
            pay(token1, address(this), decoded.payer, profit1);
        }
    }

    struct FlashParams { //this aligns with args in flash swap
        address token0;
        address token1;
        uint24 fee1;
        uint256 amount0;
        uint256 amount1;
        uint24 fee2;
        uint24 fee3;
    }

    struct FlashCallbackData {
        uint256 amount0;
        uint256 amount1;
        address payer;
        PoolAddress.PoolKey poolKey;
        uint24 poolFee2;
        uint24 poolFee3;
    }

    function initFlash(FlashParams memory params) external {
        // {token0: token0, token1: token1, fee: fee} - build this object
        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({token0: params.token0, token1: params.token1, fee: params.fee1});
        IUniswapV3Pool pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey)); //gets the pool address and creates a pool object allowing us to call objects on it


        //call flash on the pool we just created withdrawing quantities of token 0 and token 1
        pool.flash(
            address(this),
            params.amount0,
            params.amount1,
            abi.encode(
                FlashCallbackData({
                    amount0: params.amount0,
                    amount1: params.amount1,
                    payer: msg.sender,
                    poolKey: poolKey,
                    poolFee2: params.fee2,
                    poolFee3: params.fee3
                })
            )
        );
    }
}