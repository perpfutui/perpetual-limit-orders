pragma solidity 0.6.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SmartWallet is Ownable {

  address LimitOrderBook;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;

  constructor() public {
    IERC20(USDC).approve(0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd, type(uint256).max);
  }

  // TODO: establish whether it is better to do these functions within inline assembly
  // Could use openzeppelin address.sol here
  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory) {
    //bool success;
    (bool success, bytes memory result) = target.call(callData);
    //require(success, string(result));
    //console.logBytes(result);
    if (success == false) {
    assembly {
        let ptr := mload(0x40)
        let size := returndatasize()
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
    }
}
return result;
  }

  /*function executeDelegateCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory result) {
    bool success;
    (success, result) = target.delegatecall(callData);
    require(success, 'Error executing delegatecall');
    console.logBytes(result);
  }*/

  function setOrderBook(
    address _addr
  ) public {
    require(LimitOrderBook == address(0), 'LOB has already been set');
    LimitOrderBook = _addr;
  }

  function executeOrder(
    uint order_id
  ) public returns (bool) {
    //who can call this function? perhaps we should set this to just LOB/
    //It is possible for somebody to deploy their own smartwallet, so only refer
    // to addresses included within the SmartWalletFactory
    require(msg.sender == LimitOrderBook, 'Only execute from the order book');
    console.log('Attempting to execute order: ', order_id);
    // DO ALL THE NECESSARY CHEKS
    // INTERACT WITH CLEARING HOUSE
    // ????
    // PROFIT
    return true;
  }

}

contract SmartWalletFactory {
  event Created(address indexed owner, address indexed smartWallet);
  mapping (address => address) public getSmartWallet;

  address public LimitOrderBook;

  constructor(address _addr) public {
    LimitOrderBook = _addr;
  }

  function spawn() public returns (address smartWallet) {
    address owner = msg.sender;
    require(getSmartWallet[owner] == address(0), 'Already has smart wallet');

    bytes memory bytecode = type(SmartWallet).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    assembly {
      smartWallet := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }

    emit Created(owner, address(smartWallet));
    SmartWallet(smartWallet).transferOwnership(owner);
    SmartWallet(smartWallet).setOrderBook(LimitOrderBook);
    getSmartWallet[owner] = smartWallet;
  }

}
