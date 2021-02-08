pragma solidity 0.6.9;

import "hardhat/console.sol";
import "./SmartWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

  event OrderCreated(address indexed trader, int limit, int size, int expiry, int leverage, address asset);

  struct LimitOrder {
    //OrderType Type; //
    int LimitPrice; //
    int PositionSize;
    int Expiry; // Block timestamp better than block number
    int Leverage;
    bool StillValid;
    address Asset;
    address Trader;
  }
  LimitOrder[] public orders;

  SmartWalletFactory public factory;

  constructor() public {}

  function addLimitOrder(int _limit, int _size, int _expiry, int _leverage, address _asset) public {
    orders.push(LimitOrder(
      _limit,
      _size,
      _expiry,
      _leverage,
      true,
      _asset,
      msg.sender
      ));
    emit OrderCreated(msg.sender, _limit, _size, _expiry, _leverage, _asset);
  }

  function setFactory(address _addr) public onlyOwner{
    factory = SmartWalletFactory(_addr);
  }

  function getLimitOrder(uint id) public view onlyValidOrder(id) returns (int, int, int, int, bool, address, address) {
    LimitOrder memory order = orders[id];
    return (order.LimitPrice, order.PositionSize, order.Expiry, order.Leverage, order.StillValid, order.Asset, order.Trader );
  }

  function execute(uint id) public onlyValidOrder(id) {
    console.log("LOB: execute ", id);
    address _smartwallet = factory.getSmartWallet(orders[id].Trader);
    console.log("Proxy address", _smartwallet);
    SmartWallet(_smartwallet).executeOrder(id);
  }

  function getTrailingStopPrice() {

  }

  modifier onlyValidOrder(uint id) {
    require(id < orders.length, 'Invalid ID');
    _;
  }

}
