// eslint-disable-next-line @typescript-eslint/no-var-requires
import { configService } from './src/config/config.service'

const config = configService.getTypeOrmConfig()
module.exports = { ...config }