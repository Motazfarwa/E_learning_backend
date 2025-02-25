const Roles = {
    ADMIN:"ADMIN",
    INSTRUCTEUR:"INSTRUCTEUR",
    APPRENANT:"APPRENANT",
    EXPERT:"EXPERT"

}

const inRole = (...roles) =>(req,res,next)=>{
const exist = roles.find((role)=> role === req.user.role)
if(!exist){
    return res.status(403).send({message:"not allowed"});
}
next();
}
module.exports.rolemiddleware={
    Roles,inRole
}