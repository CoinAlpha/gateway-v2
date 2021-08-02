# test that the gateway-api server is running
curl -X GET localhost:5000/

# test that the ethereum routes are mounted
curl -X GET localhost:5000/eth/

# the environment variable ETH_PRIVATE_KEY must be set with your private key
# in order for the following tests to work

# get balances for your private key
curl -X POST -H "Content-Type: application/json" -d "{\"privateKey\":\"$ETH_PRIVATE_KEY\",\"tokenSymbols\":[\"ETH\",\"WETH\",\"DAI\"]}" localhost:5000/eth/balances

curl -X POST -H "Content-Type: application/json" -d "{\"privateKey\":\"$ETH_PRIVATE_KEY\",\"tokenSymbols\":[\"DAI\"]}" localhost:5000/eth/balances