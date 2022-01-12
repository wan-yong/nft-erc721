# Mint the NFT with Hyperledger Fabric - erc721 token

## Deploy the chaincode

```
# Choose your method to delpoy either in test-network or a kube based env.
N/A
```

## CLI introduce

### Setup 

To install and run, you must have NPM installed. The below is tested and passed on `Ubuntu 20`.

1. Clone this repository and move into the `minty` directory:

    ```shell
    git clone https://github.com/wan-yong/nft-erc721.git
    cd ./application
    ```

1. Install the NPM dependencies:

    ```shell
    npm install
    ```

1. Add the `minty` command to your `$PATH`. This makes it easier to run Minty from anywhere:

    ```
    sudo npm link
    ```

1. Register and Enroll the `minter` and `receipt`. This should be an admin flow in prod env. Remember to remove all the info in `wallet` folder if you run the following before.

    ```
    cd ./src/enroll
    rm -rf ../../wallet/*
    node enrollAdmin.js Org1
    node registerEnrollUser.js Org1 minter
    node enrollAdmin.js Org2
    node registerEnrollUser.js Org2 recipient
    ```

### Config

TODO

### Commands

The CLI helps to `mint`, `show`, `transfer` and `pin` the NFT tokens. A `help` is provided. For example,

`minty help <command>` for help on a specific command: 

```
minty help mint

> create a new NFT from an image file
> 
> Options:
>   -n, --name <name>         The name of the NFT
>   -d, --description <desc>  A description of the NFT
>   -o, --owner <address>     The ethereum address that should own the NFT.If not provided,
>                             defaults to the first signing address.
>   -h, --help                display help for command
```

### Mint a new NFT

Input the name of the NFT, and a description to tell users what the NFT is for:

```shell
cd ~
minty help mint
minty mint ~/art.txt --name "Art #1" --description "This serves as proof-of-ownership."
```

### Show the NFT

Show details, replace `<tokenId>` with the newly created NFT token id:

```shell
minty help show
minty show <tokenId> -a
```
Check the based 64 encoded content with any tool/website, for example: `https://base64.us`

### Transfer

Get the token id and owner address:

```shell
Token ID:              1641904109263
Owner Address:         x509::/OU=org1/OU=client/OU=department1/CN=minter::/C=US/ST=North Carolina/L=Durham/O=org1.example.com/CN=ca.org1.example.com
```

Set them as the env paramenters, and transfer. Here we use a `RECIPIENT="noExistOwner"` as the recipient.

```shell
export MINTER="x509::/OU=org1/OU=client/OU=department1/CN=minter::/C=US/ST=North Carolina/L=Durham/O=org1.example.com/CN=ca.org1.example.com"
export RECIPIENT="noExistOwner"
minty transfer 1641904109263 "$MINTER" "$RECIPIENT"
```

Check the NFT owner again.

```shell
minty show 1641904109263
```

The `Owner Address` is changed to `Owner Address`. 

```shell
Token ID:              1641904109263
Owner Address:         noExistOwner
Metadata Address:      bafybeihytaklbwfqcyp6svivqm7z3je6ebyasws4tgihsxdpdm2qur3bsu/metadata.json
Metadata Gateway URL:  https://ipfs.infura.io:8080/ipfs/bafybeihytaklbwfqcyp6svivqm7z3je6ebyasws4tgihsxdpdm2qur3bsu/metadata.json
Asset Address:         ipfs://bafybeiamwa5yumt2rcjnnoofgbrxpbhcofceemqhvvda247uunra4dt42e/art.txt
Asset Gateway URL:     https://ipfs.infura.io:8080/ipfs/bafybeiamwa5yumt2rcjnnoofgbrxpbhcofceemqhvvda247uunra4dt42e/art.txt
NFT Metadata:
{
  "name": "Art #1",
  "description": "This serves as proof-of-ownership.",
  "image": "ipfs://bafybeiamwa5yumt2rcjnnoofgbrxpbhcofceemqhvvda247uunra4dt42e/art.txt"
}
```

### Pin IPFS assets for an NFT

To make the data highly available, you can request that a [Remote Pinning Service](https://ipfs.github.io/pinning-services-api-spec) like [Pinata](https://pinata.cloud/) or [nft.storage](https://nft.storage) store a copy of your IPFS data on their IPFS nodes.

To pin the data for token, use the `minty pin` command:

```shell
minty pin 11641904109263

> Pinning asset data (ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/ticket.txt) for token id 1....
> Pinning metadata (ipfs://bafybeic3ui4dj5dzsvqeiqbxjgg3fjmfmiinb3iyd2trixj2voe4jtefgq/metadata.json) for token id 1...
> 🌿 Pinned all data for token id 1
```

The `pin` command looks for some configuration info to connect to the remote pinning service. See the [Configuration section](#config) above for details.