
// using promises

const asyncHandler = (requestHandler) => {
    (req,resp,next) => {
        Promise.
        resolve(requestHandler)
        .catch((err)=>next)
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