import "server-only";import {ReviewStatus} from "@prisma/client";import {db} from "@/lib/db";import{publicScheduleWhere}from"@/lib/content/visibility";
const include={product:{select:{name:true,slug:true}}} as const;
const published=()=>({status:ReviewStatus.PUBLISHED,...publicScheduleWhere()});
export async function getHomepageReviews(){const featured=await db.review.findMany({where:{...published(),featured:true},include,orderBy:[{pinned:"desc"},{sortOrder:"asc"},{createdAt:"desc"}],take:6});return featured.length?featured:db.review.findMany({where:published(),include,orderBy:[{pinned:"desc"},{sortOrder:"asc"},{createdAt:"desc"}],take:6})}
export function getProductReviews(productId:string){return db.review.findMany({where:{productId,...published()},orderBy:[{pinned:"desc"},{sortOrder:"asc"},{createdAt:"desc"}]})}
