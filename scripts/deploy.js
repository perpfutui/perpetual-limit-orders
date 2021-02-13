async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const LimitOrderBook = await ethers.getContractFactory("LimitOrderBook")
  const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory")

  const lob = await LimitOrderBook.deploy()
  console.log("Limit Order Book address:", lob.address);

  await lob.deployed()

  const swf = await SmartWalletFactory.deploy(lob.address)
  console.log("Smart wallet factory:", swf.address);

  await swf.deployed()

  var setfac = await lob.setFactory(swf.address)
  var sfl = await setfac.wait()
  console.log('Setting factory at tx: '+sfl.transactionHash)

  var spawn = await swf.spawn()
  var spl = await spawn.wait()
  console.log('Spawning proxy at tx: '+spl.transactionHash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
