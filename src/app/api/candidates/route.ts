import { Program } from "@coral-xyz/anchor";
import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Vote } from "anchor/target/types/vote";
import { BN } from "bn.js";

const IDL = require('@/../anchor/target/idl/vote.json')

export async function OPTIONS(request: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            ...ACTIONS_CORS_HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
    });
}

export async function GET(request: Request) {

    const getResponse: ActionGetResponse = {
        icon: "https://imgs.search.brave.com/sIc2Tpz52aisBVGI68iGe-eYcWhmYSaBO8yTP1rvIHY/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9jbG9zZS11cC11/bmNvbXBsZXRlZC1l/bGVjdGlvbi1xdWVz/dGlvbm5haXJlLXdp/dGgtcGVuXzIzLTIx/NDgyNjU1NDMuanBn/P3NpemU9NjI2JmV4/dD1qcGc",
        description: "Initialize candidate",
        type: "action",
        label: "Create Candidates",
        title: "Initialize candidate",
        links: {
            actions : [
                {
                    type: "transaction",

                    parameters: [
                        {
                            name: "poll_id",
                            required: true,
                            label: "Poll id"
                        },
                    {
                        name: "candidate_name1",
                        max: 280,
                        min: 1,
                        required: true,
                        label: "Candidate 1"
                    },
                    {
                        name: "candidate_name2",
                        max: 280,
                        min: 1,
                        required: true,
                        label: "Candidate 2"
                    }
                ],
                    href: "http://localhost:3001/api/vote?candidate_name1={candidate_name1}&candidate_name2={candidate_name2}&poll_id={poll_id}",
                    label: "Initialize Candidates"
                }
            ]
        }
    }
    return Response.json(getResponse, { headers: ACTIONS_CORS_HEADERS});
  }
  

  export async function POST(request: Request) {
    const url = new URL(request.url);
    const candidate_name1 = url.searchParams.get("candidate_name1") ?? "X";
    const candidate_name2 = url.searchParams.get("candidate_name2") ?? "Y";
    const poll_id = url.searchParams.get("poll_id") ?? "1";

    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=260b6330-b5e2-4aa9-bb3f-f6be42cfe849", "confirmed");
    const program: Program<Vote> = new Program(IDL, {connection});

    const body: ActionPostRequest = await request.json();
    let voter;

    try {
        voter = new PublicKey(body.account);
      } catch (error) {
        return new Response("Invalid account", { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    

    const instruction2 = await program.methods.initializeCandidate(
        candidate_name1,
        new BN(poll_id),
    ).accounts({
        signer: voter,
    }).instruction();

    const instruction3 = await program.methods.initializeCandidate(
        candidate_name2,
        new BN(poll_id),
    ).accounts({
        signer: voter,
    }).instruction();


    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(instruction2, instruction3);
  
    const response = await createPostResponse({
      fields: {
        type: "transaction",
        message: "Candidates created successfully! 🎉",
        transaction: transaction,
      },
    });


    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  }