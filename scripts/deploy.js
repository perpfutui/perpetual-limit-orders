async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const LimitOrderBook = await ethers.getContractFactory("LimitOrderBook")
  const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory")
  const MINIMUM_FEE = ethers.utils.parseUnits('0.1',18)


  const lob = await LimitOrderBook.deploy()
  console.log("Limit Order Book address:", lob.address);
  await lob.deployed()

  // const lob = await ethers.getContractAt('LimitOrderBook','0x776Db87e14Ef3C3804a29b8Ec0537391bC70d498')

  const swf = await SmartWalletFactory.deploy(lob.address)
  console.log("Smart wallet factory:", swf.address);
  await swf.deployed()

  // const swf = await ethers.getContractAt('SmartWalletFactory','0xC14fd36F3daF563AE80a3FAbaaF6ccaC4E66D11D')

  // var setfac = await lob.setFactory(swf.address)
  // var sfl = await setfac.wait()
  // console.log('Setting factory at tx: '+sfl.transactionHash)

  var setfee = await lob.changeMinimumFee({d: MINIMUM_FEE})
  var setfeetx = await setfee.wait()
  console.log('Fee set at tx: '+setfeetx.transactionHash)

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
