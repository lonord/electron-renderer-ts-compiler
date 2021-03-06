import { spawn } from 'child_process'
import * as debug from 'debug'
import * as debounce from 'lodash.debounce'

const log = debug('electron-renderer-ts-compiler')

export type TSCompiler = (onBuildSuccess: () => void, onUpdate?: () => void) => void
export interface TSCompilerOption {
	tsc?: string
	tsconfig?: string
	cwd?: string
	updateDelayTime?: number
}

export default function createTsCompiler(option: TSCompilerOption = {}): TSCompiler {
	log('user provided option: %j', option)
	const tsc = option.tsc || './node_modules/.bin/tsc'
	const tsconfig = option.tsconfig || 'tsconfig.renderer.json'
	const cwd = option.cwd || process.cwd()
	const updateDelayTime = option.updateDelayTime || 1000
	log('tsc: %s', tsc)
	log('tsconfig: %s', tsconfig)
	log('cwd: %s', cwd)
	log('updateDelayTime: %n', updateDelayTime)
	return (onBuildSuccess: () => void, onUpdate?: () => void) => {
		const child = spawn(tsc, ['-w', '-p', tsconfig], { cwd })
		let buildSuccess = false
		const debouncedUpdate = onUpdate ? debounce(onUpdate, updateDelayTime) : onUpdate
		child.stdout.on('data', (msg) => {
			log('stdout data: %O', msg)
			if (isClearChar(msg as Buffer)) {
				return
			}
			const info = msg.toString()
			console.info(info)
			if (info.indexOf('Compilation complete') !== -1) {
				if (!buildSuccess) {
					buildSuccess = true
					onBuildSuccess()
				} else {
					debouncedUpdate && debouncedUpdate()
				}
			}
		})
		child.stderr.on('data', (msg) => {
			log('stderr data: %O', msg)
			console.error(msg.toString())
		})
		child.on('close', (code, signal) => {
			log('close event: code=%n, signal=%s', code, signal)
			if (signal === 'SIGINT' || signal === 'SIGTERM') {
				process.exit(0)
			} else {
				console.log(`tsc watch process exited with code ${code}`)
			}
		})
	}
}

function isClearChar(data: Buffer) {
	if (data && data.length > 1) {
		return data[0] === 27 && data[1] === 99
	}
	return false
}
