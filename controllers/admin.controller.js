import prisma from "../prisma/client.js";

export const getPendingJournalists=async(req,res)=>{
  try {
    const pending=await prisma.journalistProfile.findMany({
      where:{verified:false},
      include:{
        user:{
          select:{
            id:true,
            email:true,
            createdAt:true,
          },
        },
      },
      orderBy:{createdAt:"asc"},
    });
  
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({error:"Failed to fetch journalist applications"});
  }
};

export const approveJournalist=async(req,res)=>{
  try {
    const{journalistId}=req.params;

    console.log(journalistId);
  
    const journalist=await prisma.journalistProfile.findUnique({
      where:{id:journalistId},
    });
  
    if(!journalist){
      return res.status(404).json({error:"Journalist not found"});
    }
  
    await prisma.$transaction([
      prisma.journalistProfile.update({
        where:{id:journalistId},
        data:{verified:true},
      }),
      prisma.user.update({
        where:{id:journalist.userId},
        data:{role:"JOURNALIST"},
      }),
    ]);
  
    res.json({message:"Journalist approved successfully"});
  } catch (error) {
    res.status(500).json({error:"Internal Server error"});
  }
};


export const rejectJournalist = async (req, res) => {
  const { journalistId } = req.params;

  try {
    await prisma.journalistProfile.delete({
      where: { id: journalistId },
    });

    res.json({ message: "Journalist rejected" });
  } catch (err) {
    res.status(500).json({ error: "Rejection failed" });
  }
};