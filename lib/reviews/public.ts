import "server-only";import {ReviewStatus} from "@prisma/client";import {db} from "@/lib/db";
const include={product:{select:{name:true,slug:true}}} as const;
export async function getHomepageReviews(){const featured=await db.review.findMany({where:{status:ReviewStatus.PUBLISHED,featured:true},include,orderBy:[{sortOrder:"asc"},{createdAt:"desc"}],take:6});return featured.length?featured:db.review.findMany({where:{status:ReviewStatus.PUBLISHED},include,orderBy:[{sortOrder:"asc"},{createdAt:"desc"}],take:6})}
export function getProductReviews(productId:string){return db.review.findMany({where:{productId,status:ReviewStatus.PUBLISHED},orderBy:[{sortOrder:"asc"},{createdAt:"desc"}]})}
