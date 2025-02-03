// async handler are higher order function: which accept other function as parameter or return  function

const asyncHandler = (requestHadler) => {
    (req, res, next) => {
        Promise.resolve(requestHadler(req, res, next)).
            catch(err => next(err));
    }
}




export { asyncHandler };




// fn is callback function and it is passed in another function executed here
// const asyncHandler =()=>{}
// const asyncHandler = (fn)=>{()=>{}}
// const asyncHandler = (fn)=> async()=>{}



// const asyncHandler = (fn) => () => {
//     return async (req, res, next) => {
//         try {
//             await fn(req, res, next)
//         } catch (error) {
//             res.status(err.code || 500).json({
//                 success: false,
//                 message: err.message
//             })
//         }
//     }
// }



