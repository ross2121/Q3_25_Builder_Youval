import wallet from "../trubin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { 
    createMetadataAccountV3, 
    CreateMetadataAccountV3InstructionAccounts, 
    CreateMetadataAccountV3InstructionArgs,
    DataV2Args
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey, createGenericFile } from "@metaplex-foundation/umi";

// Define our Mint address
const mint = publicKey("735dt5HekUQQq3qi9NLttRegp6koRAA5nX6Uv3LHMXJS")

// Create a UMI connection thje t
const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));
umi.use(irysUploader());

(async () => {
    try {

        const imageUri = "https://media.licdn.com/dms/image/v2/D560BAQFCvzGKgNWmTQ/company-logo_200_200/company-logo_200_200/0/1733371087700/turbin3_logo?e=2147483647&v=beta&t=zIKTy9Hx-t4D9lEc-UjcEFA45b6-rzgk_sICHeTR46c"; // Replace with your image URL

        
        const metadata = {
            name: "Youval Token",
            symbol: "SYS", 
            description: "My awesome token with custom image",
            image: imageUri,
            attributes: [
                {
                    trait_type: "Creator",
                    value: "Youval"
                },
                {
                    trait_type: "Type", 
                    value: "Custom Token"
                }
            ],
            properties: {
                files: [
                    {
                        uri: imageUri,
                        type: "image/png"
                    }
                ],
                category: "image"
            }
        };
        const metadataFile = createGenericFile(JSON.stringify(metadata), "metadata.json", {
            contentType: "application/json"
        });
        const [metadataUri] = await umi.uploader.upload([metadataFile]);
        console.log("Metadata uploaded:", metadataUri);
        let accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint:mint,
            mintAuthority:signer,
        }
        
        let data: DataV2Args = {
            name:"Youval Token",
            symbol:"SYS",
            uri:metadataUri,
            sellerFeeBasisPoints:500, 
            creators:[{
                address: signer.publicKey,
                verified: true,
                share: 50
            }],
            collection:null,
            uses:null 
        }

        let args: CreateMetadataAccountV3InstructionArgs = {
            data:data,
            isMutable:true,
            collectionDetails:null
        }

        let tx = createMetadataAccountV3(
            umi,
            {
                ...accounts,
                ...args
            }
        )

        let result = await tx.sendAndConfirm(umi);
        console.log("final",result);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
