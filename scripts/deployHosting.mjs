import { spawnSync } from 'node:child_process'

const projectId = 'directors-move-2026'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd:process.cwd(),
    encoding:'utf8',
    stdio:options.capture ? 'pipe' : 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr ?? '')
    process.exit(result.status ?? 1)
  }
  return (result.stdout ?? '').trim()
}

console.log(`[deploy] Activating Firebase project: ${projectId}`)
run('firebase', ['use', projectId])

const activeProject = run('firebase', ['use'], { capture:true })
if (activeProject !== projectId) {
  console.error(`[deploy] Aborted: active Firebase project is "${activeProject}", expected "${projectId}".`)
  process.exit(1)
}

console.log(`[deploy] Verified active Firebase project: ${activeProject}`)
run('npm', ['run', 'build'])
run('firebase', ['deploy', '--only', 'hosting', '--project', projectId])
