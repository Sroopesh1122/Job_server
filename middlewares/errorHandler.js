export const errorHandler =(err,req,res,next)=>{
    const statusCode =  res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        error:true,
        message:err?.message?.replace("Error:",""),
        stack: err?.stack,
    });
}


export const notFound = async(req,res,next)=>{
    const error = new Error("Page Not Found!!")
    next(error);
}
