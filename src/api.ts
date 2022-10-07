import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Credentials } from "@aws-sdk/types";


export async function getDefaultCredentials():Promise<Credentials>
{
    const provider = defaultProvider();
    const credential = provider();
    return credential;
}

