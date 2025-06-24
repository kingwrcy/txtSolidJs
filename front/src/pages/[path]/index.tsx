import Icon from "@/component/Icon";
import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense } from "solid-js";
import toast from 'solid-toast';
import mdCss from "./markdown.module.css";

function DetailSkeleton() {
  return (
    <div class="w-full max-w-[800px] mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 animate-pulse">
      <div class="space-y-4">
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div class="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}

// ✅ 提取工具提示组件
function Tooltip(props: { children: any; text: string }) {
  return (
    <div class="relative group">
      {props.children}
      <div class="absolute left-0 -bottom-10 w-max p-2 text-xs font-medium text-white bg-gray-900 dark:bg-black rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {props.text}
        <div class="absolute left-4 -top-1 w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45"></div>
      </div>
    </div>
  );
}

// ✅ 提取错误组件
function ErrorFallback(props: { error: Error; reset: () => void }) {
  return (
    <div class="max-w-[800px] mx-auto flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          加载失败
        </h2>
        <p class="text-red-600 dark:text-red-300 mb-4">
          {props.error.message}
        </p>
        <button
          onClick={props.reset}
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}

export default function Detail() {
  const navigate = useNavigate();
  const params = useParams();
  const [success, setSuccess] = createSignal(false);

  // ✅ 优化数据获取逻辑
  const [data] = createResource(
    () => params.path,
    async (path) => {
      if (!path) {
        throw new Error('路径参数缺失');
      }

      try {
        const response = await fetch(`/api/memo/${path}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setSuccess(result.success);

        if (result.success) {
          return {
            content: result.data.content,
            htmlContent: result.data.html_content,
            type: result.data.type,
            deletedAt: result.data.deleted_at,
            createdAt: result.data.created_at,
            updatedAt: result.data.updated_at,
          };
        } else {
          throw new Error(result.details || '获取内容失败');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        toast.error(`获取内容失败: ${error.message}，3秒后返回首页`, {
          duration: 3000,
          position: 'top-center',
          className: 'text-xs'
        });

        setTimeout(() => {
          navigate('/');
        }, 3000);

        throw error;
      }
    }
  );

  // ✅ 使用 createMemo 优化渲染内容
  const renderContent = createMemo(() => {
    const item = data();
    if (!item) return '';

    // 如果有 HTML 内容，优先使用
    if (item.type === 'markdown' && item.htmlContent) {
      return item.htmlContent;
    }

    // 否则使用纯文本内容，进行简单的 HTML 转义
    return item.content.replace(/\n/g, '<br>');
  });

  // ✅ 优化复制功能，添加错误处理
  const copyToClipboard = async (content: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(successMessage);
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  const copyRaw = () => {
    const item = data();
    if (item?.content) {
      copyToClipboard(item.content, '内容已复制到剪贴板');
    }
  };

  const copyHtml = () => {
    const item = data();
    if (item?.htmlContent) {
      copyToClipboard(item.htmlContent, 'HTML内容已复制到剪贴板');
    }
  };

  // ✅ 优化日期格式化
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '无效日期';
    }
  };

  // ✅ 检查数据有效性
  const isDataValid = createMemo(() => {
    const item = data();
    return item && success();
  });

  return (
    <ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}>
      <Suspense fallback={<DetailSkeleton />}>
        <Show when={isDataValid()}>
          <div class="max-w-[800px] mx-auto flex flex-col gap-4 justify-center py-12">
            {/* ✅ 优化工具栏 */}
            <div class="flex items-center gap-2 p-3 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-300">
              <Tooltip text="返回首页">
                <Icon
                  icon="back"
                  size={20}
                  onClick={() => navigate('/')}
                  class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                />
              </Tooltip>

              <Show when={data()?.content}>
                <Tooltip text="复制原文">
                  <Icon
                    icon="copyRaw"
                    size={20}
                    onClick={copyRaw}
                    class="hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  />
                </Tooltip>
              </Show>

              <Show when={data()?.type === 'markdown' && data()?.htmlContent}>
                <Tooltip text="复制HTML内容">
                  <Icon
                    icon="copyHtml"
                    size={20}
                    onClick={copyHtml}
                    class="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                  />
                </Tooltip>
              </Show>

              <Tooltip text="编辑内容">
                <Icon
                  icon="edit"
                  size={20}
                  onClick={() => navigate('/?path=' + params.path)}
                  class="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                />
              </Tooltip>

              <Show when={data()?.deletedAt}>
                <div class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  <span class="hidden sm:inline">于</span>
                  <span class="font-mono">{formatDate(data()!.deletedAt)}</span>
                  <span class="hidden sm:inline">过期失效</span>
                </div>
              </Show>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 transition-colors duration-300">
              <Show
                when={success()}
                fallback={
                  <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    暂无内容
                  </div>
                }
              >
                <div
                  innerHTML={renderContent()}
                  class={`${mdCss["markdown-body"]} prose dark:prose-invert max-w-none`}
                />
              </Show>
            </div>

            {/* ✅ 优化时间戳显示 */}
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-4 flex flex-col sm:flex-row justify-between gap-2 px-2">
              <Show when={data()?.createdAt}>
                <p class="font-mono">
                  创建于 {formatDate(data()!.createdAt)}
                </p>
              </Show>
              <Show when={data()?.updatedAt}>
                <p class="font-mono">
                  更新于 {formatDate(data()!.updatedAt)}
                </p>
              </Show>
            </div>
          </div>
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}
