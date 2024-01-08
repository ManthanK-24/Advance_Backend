
// using promises

const asyncHandler = (requestHandler) => {
    return (req,resp,next) => {
        Promise.resolve(requestHandler(req,resp,next)).catch((err)=>next(err))
    }
}


export {asyncHandler}


// using try catch
// higher order functions => which treats fn as variable, takes fn in params, returns fn etc

/*
const asyncHandler = (func) => async (req,resp,next) => {
    try {
        
    } catch (error) {
        resp.status(err.code || 500).json({
            success:false,
            message: err.message
        })
    }
}
*/