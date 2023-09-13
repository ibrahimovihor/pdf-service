import { isCelebrateError, Segments } from 'celebrate'
import * as statusCodes from '../constants/statusCodes'

const joiErrors = (err, req, res, next) => {
  if (!isCelebrateError(err)) {
    req.joiError = false
    return next(err)
  }

  const params = err.details.get(Segments.PARAMS)
  const query = err.details.get(Segments.QUERY)
  const body = err.details.get(Segments.BODY)
  const segment = params || query || body

  return res.status(statusCodes.UNPROCESSABLE_ENTITY).json({
    statusCode: statusCodes.UNPROCESSABLE_ENTITY,
    success: false,
    errors: segment.details.map(detail => ({ [detail.context.key]: detail.message.replace(/"/g, '') }))
  })
}

export default joiErrors
