class BaseController {
  constructor (service) {
    this.service = service
  }

  recordName () {
    return this.service.singleRecord()
  }
}

export default BaseController
