import { defaultProvider } from '@aws-sdk/credential-provider-node';

export function getDefaultProvider():string{
    const provider = defaultProvider();
    return provider.name;
}