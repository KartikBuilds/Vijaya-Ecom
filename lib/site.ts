const configuredUrl=process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const site={name:"Vijaya Premix",url:configuredUrl&&/^https?:\/\//.test(configuredUrl)?configuredUrl.replace(/\/$/,""):"http://localhost:3000",description:"Ready-to-cook Indian premixes from Vijaya Premix."} as const;
