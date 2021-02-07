pragma solidity 0.6.9;

import "hardhat/console.sol";

contract LimitOrderBook {

  event OrderCreated(address indexed trader, int limit, int size, int expiry, int leverage, address asset);

  struct LimitOrder {
    int LimitPrice;
    int PositionSize;
    int Expiry;
    int Leverage;
    bool StillValid;
    address Asset;
    address Trader;
  }
  LimitOrder[] public orders;

  ProxyFactory private factory;

  constructor() public {}

  function addLimitOrder(int _limit, int _size, int _expiry, int _leverage, address _asset) public {
    orders.push(LimitOrder(
      _limit,
      _size,
      _expiry,
      _leverage,
      true,
      _asset
      ));
    emit OrderCreated(msg.sender, _limit, _size, _expiry, _leverage, _asset);
  }

  function getLimitOrder(uint id) public view returns (int, int, int, int, bool, address) {
    LimitOrder memory order = orders[id];
    return (order.LimitPrice, order.PositionSize, order.Expiry, order.Leverage, order.StillValid, order.Asset );
  }

}
