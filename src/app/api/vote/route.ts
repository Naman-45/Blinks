import { BN, Program } from "@coral-xyz/anchor";
import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Vote } from "anchor/target/types/vote";
import dotenv from "dotenv";

dotenv.config();
const RPC = process.env.RPC_URL;
const IDL = require('@/../anchor/target/idl/vote.json')

export const OPTIONS = GET;

export async function GET(request: Request) {

    const getResponse : ActionGetResponse = {
        icon : 'https://imgs.search.brave.com/VdB-EQzCR2QOoAoRXf6bRPnNU21jBKBO0ne1u4c9wFc/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by93/b21hbi1zaG93aW5n/LWhlci1jaG9pY2Ut/cmVmZXJlbmR1bV8y/My0yMTQ4MjY1NTE5/LmpwZz9zaXplPTYy/NiZleHQ9anBn',
        title: 'Create a poll',
        description: 'Create a poll on whatever u like and spread it among people to vote!',
        label: 'create',
        links: {
            actions : [
                {
                    type: "transaction",

                    parameters: [{
                        name: "poll_description",
                        max: 280,
                        min: 1,
                        required: true,
                        label: "Poll description"
                    },
                    {
                        name: "poll_id",
                        required: true,
                        label: "Poll id"
                    }
                ],
                    href: "http://localhost:3001/api/vote?poll_name={poll_description}&poll_id={poll_id}",
                    label: "Create a poll"
                }
            ]
        }

    }

    return Response.json(getResponse, { headers: ACTIONS_CORS_HEADERS});
  }
  
export async function POST(request: Request) {
    const url = new URL(request.url);
    const poll_description = url.searchParams.get("poll_name") ?? "Default Title";
    const poll_id = url.searchParams.get("poll_id") ?? "1";
    // const candidate1 = url.searchParams.get("candidate_description1") ?? "X";
    // const candidate2 = url.searchParams.get("candidate_description2") ?? "Y";


    const connection = new Connection(`${RPC}`, "confirmed");
    const program: Program<Vote> = new Program(IDL, {connection});

    const body: ActionPostRequest = await request.json();
    let voter;

    try {
        voter = new PublicKey(body.account);
      } catch (error) {
        return new Response("Invalid account", { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    const instruction1 = await program.methods.initializePoll(
        new BN(poll_id),
        poll_description,
        new BN(0),
        new BN(1731946507),
    ).accounts({
        signer: voter,
    }).instruction();



    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(instruction1);
  
    const response = await createPostResponse({
      fields: {
        type: "transaction",
        message: "Poll created successfully! 🎉",
        transaction: transaction,
        links : {
            next: {
                type: "post",
                href: "http://localhost:3001/api/candidates"
            }
        }
      },
    });


    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  
}  