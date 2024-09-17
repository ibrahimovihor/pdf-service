import passportJWT from 'passport-jwt'

const { ExtractJwt } = passportJWT
const JwtStrategy = passportJWT.Strategy

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY
}

const passportAuth = (passport) => {
  const strategy = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    (async () => {
      const user = jwtPayload.email
      if (user !== null) {
        const type = jwtPayload.type

        next(null, user, { type })
      } else {
        next({ message: 'user not found' }, false, null)
      }
    })().catch((error) => {
      next(error)
    })
  })

  passport.use(strategy)
}

export default passportAuth
