import prisma from "../prisma/client.js"

export const applyAsJournalistService=async(userId)=>{
    const user=await prisma.user.findUnique({
        where :{id:userId},
    });

    if(!user){
        throw new Error("User not found");
    }

    if(user.role=="JOURNALIST"){
        throw new Error("User is already a Journalist");
    }

    const existingProfile=await prisma.journalistProfile.findUnique({
        where:{userId},
    });

    if(existingProfile){
        throw new Error("Journalist application already submitted");
    }

    const journalistProfile=await prisma.journalistProfile.create({
        data:{
            userId,
            verified:false,
            credibilityScore:0,
        },
    });

    return journalistProfile;
};