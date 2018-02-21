import { spawn } from 'child_process'

export type TSCompiler = (onBuildSuccess: () => void, onUpdate?: () => void) => void
export interface TSCompilerOption {
	tsc?: string
	tsconfig?: string
	cwd?: string
}

export default function createTsCompiler(option: TSCompilerOption = {}): TSCompiler {
	const tsc = option.tsc || './node_modules/.bin/tsc'
	const tsconfig = option.tsconfig || 'tsconfig.renderer.json'
	const cwd = option.cwd || process.cwd()
	return (onBuildSuccess: () => void, onUpdate?: () => void) => {
		const child = spawn(tsc, ['-w', '-p', tsconfig], { cwd })
		let buildSuccess = false
		child.stdout.on('data', (msg) => {
			console.info(msg.toString())
			if (!buildSuccess) {
				buildSuccess = true
				onBuildSuccess()
			} else {
				onUpdate && onUpdate()
			}
		})
		child.stderr.on('data', (msg) => {
			console.error(msg.toString())
		})
		child.on('close', (code, signal) => {
			if (signal === 'SIGINT' || signal === 'SIGTERM') {
				process.exit(0)
			} else {
				console.log(`tsc watch process exited with code ${code}`)
			}
		})
	}
}
