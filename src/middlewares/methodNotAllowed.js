import * as statusCodes from '../constants/statusCodes'

const methodNotAllowed = (req, res, next) => {
  return res.status(statusCodes.METHOD_NOT_ALLOWED).json({
    statusCode: statusCodes.METHOD_NOT_ALLOWED,
    success: false,
    errors: {
      message: 'Method not allowed'
    }
  })
}
export default methodNotAllowed
