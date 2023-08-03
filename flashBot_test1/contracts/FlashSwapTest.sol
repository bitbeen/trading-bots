//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol'; //import interface for flash call back to overwrite later
import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';

import '@uniswap/v3-periphery/contracts/base/PeripheryPayments.sol';
import '@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol';
import '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol';
import '@uniswap/v3-periphery/contracts/libraries/CallbackValidation.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
//overring flash allowing us to inject logic allowing us to make tra


contract FlashSwapTest is IUniswapV3FlashCallback, PeripheryImmutableState, PeripheryPayments {
    using LowGasSafeMath for uint256; //this is where .add and other maths opps comee from
    using LowGasSafeMath for int256;
    ISwapRouter public immutable swapRouter; //define swap router address


    constructor(
        ISwapRouter _swapRouter, //swapRouter
        address _factory, //uniswapV3 Factory
        address _WETH9 //WETH on Matic

        //flash = await FlashSwapTest.deploy(SWAP_ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS)
    ) PeripheryImmutableState(_factory, _WETH9) {
        swapRouter = _swapRouter;
    }
    function uniswapV3FlashCallback( 
        //import the interface with this function (see line 4) and override it -- override the flashcall back function
        //override contract called in Uniswap V3 pools contract inside flash function
        //calling flash calls this the function inside it this runs

        //flash will run 
        // it will check for liquiity in the pool 
        //calulate fees owed based on t0 and t1
        //transfer funds then run override logic
        
        uint256 fee0, //fees owed on token 0 borrowed
        uint256 fee1, //fees owed on token 1 borrowed
        bytes calldata data //initialised struct passed in from initFlash

    )external override {//use funds to do swaps in other pools then pay it all back

        //decodes data struct passed in from initFlash
        FlashCallbackData memory decoded = abi.decode(data, (FlashCallbackData)); 
        CallbackValidation.verifyCallback(factory, decoded.poolKey); //checks pool called is really a V3 pool

        //get token 0 and 1 from the poolKey
        address token0 = decoded.poolKey.token0; 
        address token1 = decoded.poolKey.token1;

        //use transfer helper imported earler to call safe approve
        //approve the swap Router to use tokens that we got from the flashLoan
        //in uniswap the swap router does the swap not the pool itself
        TransferHelper.safeApprove(token0, address(swapRouter), decoded.amount0);//approve swap router to use tokens that we got from the flash loan
        TransferHelper.safeApprove(token1, address(swapRouter), decoded.amount1); //Error here or, here

        //minimum amount we need to get out of the swap
        //take the amount we are borrowing plus the fee it would cost
        uint256 amount1Min = LowGasSafeMath.add(decoded.amount1, fee1); //calculate mimum we need to get out of swap to make arbitrage profitable
        uint256 amount0Min = LowGasSafeMath.add(decoded.amount0, fee0);
        //if the swap won't make us atleast this amount it's not worth doing 


        //passed into swap router as amount out minium 
        //swap router does not go through unless it is going to return that amount
        //run our swap on first pool - pass in params
        //to make money we want token0 to have more value in this pool relative to the pool we borrowed money from 

        //run the swap on the first pool 
        //exactInputSingle is the simplest function to run 
        
        uint256 amountOut0 =
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token1, //to make money we need token 1 to be more valueable relative to token 1 in pool borrowed from 
                    tokenOut: token0,
                    fee: decoded.poolFee2,//pass in fee of poool we want to swap on
                    recipient: address(this),
                    deadline: block.timestamp,//if it doesn't run before deadline don't run - block.timestamp means the same block
                    amountIn: decoded.amount1,
                    amountOutMinimum: amount0Min, //swap wont go through unless it returns atleast that amount //Error here or, here - possibly no error just no opp
                    sqrtPriceLimitX96: 0
                })
            );
        //to make money we want token0 to have more value in this pool relative to the pool we borrowed money from 
        uint256 amountOut1 =
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token0, //to make money we need token 1 to be more valueable relative to token 1 in pool borrowed from 
                    tokenOut: token1,
                    fee: decoded.poolFee3,
                    recipient: address(this),
                    deadline: block.timestamp,//block.timestamp means the same block - only way to guarantee returned funds
                    amountIn: decoded.amount0,
                    amountOutMinimum: amount1Min,
                    sqrtPriceLimitX96: 0
                })
            );

        uint256 amount0Owed = LowGasSafeMath.add(decoded.amount0, fee0); //the same earlier but change in refactor
        uint256 amount1Owed = LowGasSafeMath.add(decoded.amount1, fee1); //the same earlier but change in refactor

        //call pay which comes from perifery payments lib 
        //pays back borrowed tokens 
        if (amount0Owed > 0) pay(token0, address(this), msg.sender, amount0Owed); //if we owe more than 0 pay back whats owed
        if (amount1Owed > 0) pay(token1, address(this), msg.sender, amount1Owed);

        //if the amount out fo the swap were more than we owe back to the first pool pay it to ourselves
        //Aka take profit

        //pay it to the wallet calling the flash loan contract
        if (amountOut0 > amount0Owed) {
            uint256 profit0 = LowGasSafeMath.sub(amountOut0, amount0Owed);//calculate the profit - amount out of swap minus the amount borrowed

            TransferHelper.safeApprove(token0, address(this), profit0);//approve the transfer
            pay(token0, address(this), decoded.payer, profit0); //pay the profit to the wallet
        }
        if (amountOut1 > amount1Owed) {
            uint256 profit1 = LowGasSafeMath.sub(amountOut1, amount1Owed);
            TransferHelper.safeApprove(token0, address(this), profit1);
            pay(token1, address(this), decoded.payer, profit1);
        }

        

    } 


    //------------------------------------
    //Everything after flash till structs

    struct FlashParams { //this aligns with args in flash swap
        //argumenets being passed to init flash
        address token0;
        address token1;
        uint24 fee1; //middle
        uint256 amount0;
        uint256 amount1;
        uint24 fee2; //token1 is higher - highest
        uint24 fee3; //token0 is higher - lowest
        //const tx = await flash.connect(signer2).initFlash( //call init flash from the flash pair contract
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
        // build the pool key object with information from FlashParams - {token0: token0, token1: token1, fee: fee} 
        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({token0: params.token0, token1: params.token1, fee: params.fee1});
        // gets the pool address and passes it to the uniswap pool
        //creating an object called pool that allows us to call functions on the pool specified
        IUniswapV3Pool pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));

        //call flash on the newly created pool object 
        //withdraw quantities of token0 and token1 
        //takes address of this contract, amount of token 0 and 1 to withdraw and encode the abi
        pool.flash(
            address(this),
            params.amount0,
            params.amount1,
            abi.encode( //encodes it to bytes32 data type


                FlashCallbackData({
                    amount0: params.amount0,
                    amount1: params.amount1,
                    payer: msg.sender, //signer from wallet
                    poolKey: poolKey,
                    poolFee2: params.fee2, //fee tier of higher
                    poolFee3: params.fee3 //fee tier of lower
                })
            )
        );
    }
    

}