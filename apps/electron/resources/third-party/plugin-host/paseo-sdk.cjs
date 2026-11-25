const original = require('./paseo-core.cjs').serverSdk;
const cliOptions = (command, options = {}) => {
  if (process.env.TERVELL_PLUGIN_TRUSTED === '1') return {
    command,
    options
  };
  if (command !== 'claude') return {
    command,
    options
  };
  const grants = JSON.parse(process.env.TERVELL_PLUGIN_CLI_GRANTS ?? '{}');
  if (!grants.claude) throw Error('此插件需要调用 Claude Code。请停用插件后在项目授权中允许 Claude Code CLI 和网络访问');
  if (process.env.TERVELL_PLUGIN_NETWORK !== '1') throw Error('此插件需要网络生成建议，请在项目授权中允许网络访问');
  const environment = JSON.parse(process.env.TERVELL_PLUGIN_CLI_ENV ?? '{}');
  return {
    command: grants.claude,
    options: {
      ...options,
      env: {
        ...process.env,
        ...environment,
        ...options.env
      }
    }
  };
};
Object.assign(exports, require('./paseo-core.cjs').sdk, require('./paseo-core.cjs').serverSdk);
exports.spawnProcess = (command, args, options) => {
  const call = cliOptions(command, options);
  return original.spawnProcess(call.command, args, call.options);
};
exports.execCommand = (command, args, options = {}) => {
  const call = cliOptions(command, options);
  return original.execCommand(call.command, args, call.options);
};
