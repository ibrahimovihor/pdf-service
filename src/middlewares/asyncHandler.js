import * as statusCodes from '../constants/statusCodes'

const asyncHandler = (cb) => async (req, res, next) => {
  try {
    return await cb(req, res, next)
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(statusCodes.BAD_REQUEST).json({
        statusCode: statusCodes.BAD_REQUEST,
        success: false,
        errors: {
          message: err.errors[0].message
        }
      })
    }
    if (err.message === 'Request failed with status code 400') {
      return res.status(statusCodes.BAD_REQUEST).json({
        statusCode: statusCodes.BAD_REQUEST,
        success: false,
        errors: {
          message: err.message
        }
      })
    }
    return res.status(err.code || statusCodes.SERVER_ERROR).json({
      statusCode: err.code || statusCodes.SERVER_ERROR,
      success: false,
      errors: {
        message: err.message
      }
    })
  }
}

export default asyncHandler
