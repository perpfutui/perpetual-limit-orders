pragma solidity 0.6.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Test {

  function log(bytes32 msg) public view{
    console.log(bytes32ToString(msg));
  }

  function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}

contract SmartWallet is Ownable {

  address LimitOrderBook;

  // TODO: establish whether it is better to do these functions within inline assembly
  // Could use openzeppelin address.sol here
  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory result) {
    bool success;
    (success, result) = target.call(callData);
    require(success, 'Error executing call');
    console.logBytes(result);
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
  ) public {
    //who can call this function? perhaps we should set this to just LOB/
    //It is possible for somebody to deploy their own smartwallet, so only refer
    // to addresses included within the SmartWalletFactory
    require(msg.sender == LimitOrderBook, 'Only execute from the order book');
    console.log('Attempting to execute order: ', order_id);
    // DO ALL THE NECESSARY CHEKS
    // INTERACT WITH CLEARING HOUSE
    // ????
    // PROFIT

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
