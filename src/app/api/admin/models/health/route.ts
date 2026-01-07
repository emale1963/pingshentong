import { NextRequest, NextResponse } from 'next/server';
import { modelConfigManager } from '@/lib/modelConfigManager';
import { checkAllModelsHealth } from '@/lib/modelHealthCheck';

/**
 * 模型配置检测接口
 * 检测模型配置是否正确，包括：
 * 1. 配置管理器是否正常工作
 * 2. 所有内置模型是否已配置
 * 3. 是否有默认模型
 * 4. 是否有启用的模型
 * 5. API接口是否正常
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/models/health called');

  try {
    const checks = [];
    let allPassed = true;

    // 检查1: 配置管理器是否正常工作
    try {
      const allConfigs = modelConfigManager.getAllConfigs();
      const defaultModel = modelConfigManager.getDefaultModel();

      if (allConfigs.length === 0) {
        checks.push({
          name: '配置管理器初始化',
          status: 'fail',
          message: '配置管理器未初始化或没有模型配置',
        });
        allPassed = false;
      } else {
        checks.push({
          name: '配置管理器初始化',
          status: 'pass',
          message: `配置管理器正常运行，共有 ${allConfigs.length} 个模型`,
        });
      }
    } catch (error) {
      checks.push({
        name: '配置管理器初始化',
        status: 'fail',
        message: `配置管理器错误: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 检查2: 是否有默认模型
    try {
      const defaultModel = modelConfigManager.getDefaultModel();

      if (!defaultModel) {
        checks.push({
          name: '默认模型配置',
          status: 'fail',
          message: '未设置默认模型',
        });
        allPassed = false;
      } else {
        const defaultConfig = modelConfigManager.getModelConfig(defaultModel);
        if (defaultConfig) {
          checks.push({
            name: '默认模型配置',
            status: 'pass',
            message: `默认模型: ${defaultConfig.name} (${defaultModel})`,
          });
        } else {
          checks.push({
            name: '默认模型配置',
            status: 'fail',
            message: `默认模型 ${defaultModel} 的配置不存在`,
          });
          allPassed = false;
        }
      }
    } catch (error) {
      checks.push({
        name: '默认模型配置',
        status: 'fail',
        message: `获取默认模型失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 检查3: 是否有启用的模型
    try {
      const allConfigs = modelConfigManager.getAllConfigs();
      const enabledConfigs = allConfigs.filter(c => c.enabled);

      if (enabledConfigs.length === 0) {
        checks.push({
          name: '启用模型检查',
          status: 'fail',
          message: '没有启用的模型',
        });
        allPassed = false;
      } else {
        checks.push({
          name: '启用模型检查',
          status: 'pass',
          message: `共有 ${enabledConfigs.length} 个启用的模型`,
        });
      }
    } catch (error) {
      checks.push({
        name: '启用模型检查',
        status: 'fail',
        message: `检查启用模型失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 检查4: 内置模型是否完整
    try {
      const allConfigs = modelConfigManager.getAllConfigs();
      const builtInConfigs = allConfigs.filter(c => !c.isCustom);

      if (builtInConfigs.length < 3) {
        checks.push({
          name: '内置模型完整性',
          status: 'warn',
          message: `内置模型数量不足 (当前: ${builtInConfigs.length}, 期望: 3)`,
        });
        // 这不算失败，只是警告
      } else {
        checks.push({
          name: '内置模型完整性',
          status: 'pass',
          message: `所有内置模型已配置 (${builtInConfigs.length} 个)`,
        });
      }
    } catch (error) {
      checks.push({
        name: '内置模型完整性',
        status: 'fail',
        message: `检查内置模型失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 检查5: 模型健康检查API
    try {
      const healthStatuses = await checkAllModelsHealth();

      if (healthStatuses.length === 0) {
        checks.push({
          name: '模型健康检查API',
          status: 'fail',
          message: '健康检查返回空结果',
        });
        allPassed = false;
      } else {
        const availableCount = healthStatuses.filter(h => h.available).length;
        checks.push({
          name: '模型健康检查API',
          status: 'pass',
          message: `健康检查API正常，${availableCount}/${healthStatuses.length} 个模型可用`,
        });
      }
    } catch (error) {
      checks.push({
        name: '模型健康检查API',
        status: 'fail',
        message: `健康检查API错误: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 检查6: 自定义模型配置
    try {
      const allConfigs = modelConfigManager.getAllConfigs();
      const customConfigs = allConfigs.filter(c => c.isCustom);

      if (customConfigs.length > 0) {
        checks.push({
          name: '自定义模型配置',
          status: 'pass',
          message: `已配置 ${customConfigs.length} 个自定义模型`,
        });
      } else {
        checks.push({
          name: '自定义模型配置',
          status: 'info',
          message: '未配置自定义模型',
        });
      }
    } catch (error) {
      checks.push({
        name: '自定义模型配置',
        status: 'fail',
        message: `检查自定义模型失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
      allPassed = false;
    }

    // 统计结果
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warnChecks = checks.filter(c => c.status === 'warn').length;
    const infoChecks = checks.filter(c => c.status === 'info').length;

    return NextResponse.json({
      success: true,
      allPassed,
      summary: {
        total: checks.length,
        passed: passedChecks,
        failed: failedChecks,
        warned: warnChecks,
        info: infoChecks,
      },
      checks,
    });
  } catch (error) {
    console.error('[API] Model config health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '模型配置检测失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
