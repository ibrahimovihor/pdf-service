import passport from 'passport'
import * as statusCodes from '../constants/statusCodes'

const checkAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, function (err, user, info) {
    if (err !== null) {
      return res.status(statusCodes.NOT_FOUND).send({
        statusCode: statusCodes.NOT_FOUND,
        success: false,
        errors: {
          message: err.message
        }
      })
    }

    if (user !== false) {
      req.user = user
      return next()
    }

    return res.status(statusCodes.UNAUTHORIZED).send({
      statusCode: statusCodes.UNAUTHORIZED,
      success: false,
      errors: {
        message: info.message
      }
    })
  })(req, res, next)
}

export default checkAuth
