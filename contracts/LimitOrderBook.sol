pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "./SmartWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";

/*
Types of Order:

A stop loss order triggers a market buy/sell when the mark price is above/below limit price

A take profit order triggers a market buy/sell when the mark price is below/above limit price

Trailing stop orders are stop loss orders with dynamic limit price - can this be done??

Please note that the price the orders get filled at may not be the limit price.

For longs:
Take profit: sell when MP > LP. set minimum output to that of LP - therefore you are guaranteed to get more§
Stop loss: sell when MP < LP. set minimum output to that of LP - this doesn't work so we need to do some clever stuff
  * market sells your asset at the NEXT AVAILABLE PRICE
Stop LIMIT - sell when MP < SP but only if it is above LP

For shorts:
Take profit: buy when MP < LP. set minimum output to that of LP - you should get more if blah
Stop loss: buy when MP > LP. issue here with minimum output.
STOP LIMIT BUY - buy when MP > SP but only if it is below LP

Take profit and Stop loss are REDUCE ONLY

Standard LIMIT BUY / LIMIT SELL are not reduce only

Parameters that we need:
ASSET ->  Address for the AMM
TRADER -> Address for the user
ORDER TYPE -> ENUM: Market, Limit, Stop-Market, Stop-Limit, Trailing-Stop
LIMIT PRICE -> Decimal
STOP PRICE -> Decimal
REDUCE-ONLY -> Bool
ORDER SIZE -> Decimal
COLLATERAL -> Decimal
LEVERAGE -> Decimal
??SLIPPAGE?? -> we should explicitly state that stop-market orders have zero slippage
FEE -> Decimal
EXPIRY -> uint block timestamp
block that order was placed in (for trailing loss)
TRAILING_TYPE =
TRAILING_ABS =
TRAILING_PCT =

Slippage needs to be done in a certain way, as we will not be able to get the off-chain price..

Limit buy - slippage, should be from limit PRICE
stop-market sell - sell when price goes below X - ?accept unlimited slippage-

stop-limit sell - sell when price below X but you can calculate slippage from LP
*/


contract LimitOrderBook is Ownable{

  event OrderCreated(address indexed trader, uint order_id);

  enum OrderType {MARKET, LIMIT, STOPMARKET, STOPLIMIT}
  enum Side { BUY, SELL }

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;

  struct LimitOrder {
    address asset;
    address trader;
    OrderType orderType;
    bool reduceOnly;
    bool stillValid;
    uint256 expiry;
    Decimal.decimal limitPrice;
    Decimal.decimal stopPrice;
    SignedDecimal.signedDecimal orderSize;
    Decimal.decimal collateral;
    Decimal.decimal leverage;
    Decimal.decimal slippage;
    Decimal.decimal tipFee;
  }
  LimitOrder[] public orders;

  SmartWalletFactory public factory;

  constructor() public {}

  function addLimitOrder(
    address _asset,
    Decimal.decimal memory _limitPrice,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage
  ) public {
    orders.push(LimitOrder({
      asset: _asset,
      trader: msg.sender,
      orderType: OrderType.LIMIT,
      limitPrice: _limitPrice,
      stopPrice: Decimal.zero(),
      orderSize: _positionSize,
      collateral: _collateral, //will always use this amount
      leverage: _leverage, //the maximum acceptable leverage, may be less than this
      slippage: _slippage, //refers to the minimum amount that user will accept
      tipFee: Decimal.zero(),
      reduceOnly: false,
      stillValid: true,
      expiry: 0
      }));
    emit OrderCreated(msg.sender,orders.length-1);
  }

  function setFactory(address _addr) public onlyOwner{
    factory = SmartWalletFactory(_addr);
  }

  function getLimitOrder(uint id) public view onlyValidOrder(id) returns (LimitOrder memory) {
    return (orders[id]);
  }


  function getLimitOrderPrices(
    uint id
  ) public view onlyValidOrder(id)
    returns(
      Decimal.decimal memory,
      Decimal.decimal memory,
      SignedDecimal.signedDecimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory) {
    LimitOrder memory order = orders[id];
    return (order.limitPrice,
      order.stopPrice,
      order.orderSize,
      order.collateral,
      order.leverage,
      order.slippage,
      order.tipFee);
  }

  function getLimitOrderParams(
    uint id
  ) public view onlyValidOrder(id)
    returns(
      address,
      address,
      OrderType,
      bool,
      bool,
      uint256) {
    LimitOrder memory order = orders[id];
    return (order.asset,
      order.trader,
      order.orderType,
      order.reduceOnly,
      order.stillValid,
      order.expiry);
    }


  function execute(uint id) public onlyValidOrder(id) {
    require(orders[id].stillValid, 'No longer valid');
    console.log("LOB: Somebody executing order: ", id);
    address _smartwallet = factory.getSmartWallet(orders[id].trader);
    console.log("-SmartWallet address: ", _smartwallet);
    bool success = SmartWallet(_smartwallet).executeOrder(id);
    if(success) {
      console.log("-Successfully called");
      orders[id].stillValid = false;
    }
  }

  modifier onlyValidOrder(uint id) {
    require(id < orders.length, 'Invalid ID');
    _;
  }

}
