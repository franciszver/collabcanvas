#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync } from 'fs'

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  } catch (error) {
    console.error('Error getting current branch:', error.message)
    return 'main' // fallback to main
  }
}

function deploy() {
  const branch = getCurrentBranch()
  console.log(`Current branch: ${branch}`)
  
  if (branch === 'main') {
    console.log('Deploying to production (main branch)...')
    execSync('npx --yes firebase-tools deploy --only hosting', { stdio: 'inherit' })
  } else if (branch === 'dev') {
    console.log('Deploying to dev preview channel...')
    execSync('npx --yes firebase-tools hosting:channel:deploy dev', { stdio: 'inherit' })
  } else {
    console.log(`Deploying to ${branch} preview channel...`)
    execSync(`npx --yes firebase-tools hosting:channel:deploy ${branch}`, { stdio: 'inherit' })
  }
}

deploy()
