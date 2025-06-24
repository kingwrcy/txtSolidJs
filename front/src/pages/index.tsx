import { debounce } from '@solid-primitives/scheduled';
import { A, useSearchParams } from '@solidjs/router';
import { createMemo, createSignal, mergeProps, onMount, Show, splitProps } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import toast from 'solid-toast';

const CopyBtn = (props) => {
  const merged = mergeProps({ size: 24, color: 'currentColor' }, props);
  const [local, others] = splitProps(merged, ['size', 'color']);
  const [copyState, setCopyState] = createSignal(false);
  const copy = () => {
    navigator.clipboard.writeText(props.text).then(() => {
      setCopyState(true);
      toast.success('链接已复制到剪贴板', { duration: 3000 })
      setTimeout(() => setCopyState(false), 5000);
    })
  };

  const CheckIcon = () => {
    return <svg
      width={local.size}
      height={local.size}
      style={{ color: local.color }}
      {...others} xmlns="http://www.w3.org/2000/svg" class='cursor-pointer inline-block' xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
  }

  const CopyIcon = () => <svg
    width={local.size}
    height={local.size}
    style={{ color: local.color }}
    {...others} onClick={copy} xmlns="http://www.w3.org/2000/svg" class='cursor-pointer inline-block' xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"></path></svg>;


  return <Show when={copyState()} fallback={<CopyIcon />}>
    <CheckIcon />
  </Show>;
};



export default function Home() {
  const [searchParams] = useSearchParams();


  const createInitialState = () => ({
    saving: false,
    done: false,
    saveData: {
      content: '',
      sameIp: false,
      password: '',
      path: '',
      type: 'text',
      keep: 7
    }
  });

  const [state, setState] = createStore(createInitialState());

  const debouncedContentUpdate = debounce((value: string) => {
    setState('saveData', 'content', value);
  }, 300);

  const handleContentChange = (e) => {
    debouncedContentUpdate(e.currentTarget.value);
  };
  const handlePathChange = (e) => {
    setState('saveData', 'path', e.currentTarget.value.trim());
  };
  const handlePasswordChange = (e) => {
    setState('saveData', 'password', e.currentTarget.value.trim());
  };
  const handleTypeChange = (e) => {
    setState('saveData', 'type', e.currentTarget.value);
  };
  const handleSameIpChange = (e) => {
    setState('saveData', 'sameIp', e.currentTarget.checked);
  };
  const handleKeepChange = (e) => {
    var keep = e.currentTarget.value.trim();
    if (keep > 30) {
      toast.error('保留天数不能超过30天', { duration: 3000 });
      return;
    }
    if (keep < 1) {
      toast.error('保留天数不能少于1天', { duration: 3000 });
      return;
    }
    if (isNaN(keep)) {
      toast.error('保留天数必须是数字', { duration: 3000 });
      return;
    }
    if (keep === '') {
      keep = 7; // 默认值
    }
    setState('saveData', 'keep', keep);
  };

  const textToCopy = createMemo(() => `${window.location.origin}/c/${state.saveData.path}`);


  const reset = () => {
    setState(reconcile(createInitialState()));
  };

  const handleSubmit = () => {
    if (!state.saveData.content.trim()) {
      toast.error('内容不能为空，请输入分享内容。', { duration: 3000 });
      return;
    }
    setState({ saving: true, done: false });
    fetch('/api/memo/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state.saveData),
    }).then((response) => {
      return response.json();
    }).then((result) => {
      if (!result.success) {
        toast.error(result.details || '保存失败，请稍后再试。', { duration: 5000 })
        return;
      }
      setState('saveData', 'path', result.data.path || state.saveData.path);
      navigator.clipboard.writeText(textToCopy()).then(() => {
        toast.success('链接已经生成,已复制到剪切板', { duration: 5000 })
        setState({ done: true });
      })
    }).finally(() => {
      setState({ saving: false, });
    });
  };

  onMount(async () => {
    if (searchParams.path) {
      const response = await fetch(`/api/memo/${searchParams.path}`);
      const result = await response.json();
      if (result.success) {
        setState('saveData', result.data);
      }
    }
  });

  return (
    <main>

      <div class="flex items-center justify-center py-12">
        <div class="w-full max-w-[800px] mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 transition-colors duration-300">

          <div>
            <label for="editor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分享内容</label>
            <textarea value={state.saveData.content} onInput={handleContentChange}
              id="editor"
              class="min-h-[350px] w-full bg-gray-50 dark:bg-gray-900/70 rounded-lg p-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>

          <div class="space-y-6">
            <div class="relative flex items-start group">
              <div class="flex items-center h-5">
                <input onChange={handleSameIpChange} id="same-ip" name="same-ip" type="checkbox" checked={state.saveData.sameIp} class="h-4 w-4 text-indigo-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 cursor-pointer" />
              </div>
              <div class="ml-3 text-sm">
                <label for="same-ip" class="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">仅限相同IP访问</label>
              </div>
              <div class="absolute left-0 -bottom-10 w-max p-2 text-xs font-medium text-white bg-gray-900 dark:bg-black rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                勾选后，只有创建时使用的IP地址才能访问此内容。
                <div class="absolute left-4 -top-1 w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45"></div>
              </div>
            </div>

            <div class="relative group">
              <label for="password" class="block text-sm font-medium text-gray-600 dark:text-gray-400">修改密码</label>
              <div class="mt-1">
                <input onInput={handlePasswordChange} autocomplete='off' type="newpassword" name="password" value={state.saveData.password} id="password" class="block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
              </div>
              <div class="absolute left-0 -bottom-10 w-max p-2 text-xs font-medium text-white bg-gray-900 dark:bg-black rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                留空则无法更新!
                <div class="absolute left-4 -top-1 w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45"></div>
              </div>
            </div>

            <div class="relative group">
              <label for="keep" class="block text-sm font-medium text-gray-600 dark:text-gray-400">保留天数</label>
              <div class="mt-1">
                <input onInput={handleKeepChange} type="number" autocomplete='off' name="keep" value={state.saveData.keep} id="keep" class="block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
              </div>
              <div class="absolute left-0 -bottom-10 w-max p-2 text-xs font-medium text-white bg-gray-900 dark:bg-black rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                默认7天,最多30天,更新可以延长保留时间。
                <div class="absolute left-4 -top-1 w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45"></div>
              </div>
            </div>

            <div>
              <label for="access-path" class="block text-sm font-medium text-gray-600 dark:text-gray-400">自定义访问路径</label>
              <div class="mt-1 flex rounded-md shadow-sm ">
                <span class="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-900/70 text-gray-500 dark:text-gray-400 sm:text-sm transition-colors">
                  {window.location.origin}/c/
                </span>
                <input autocomplete='off' onInput={handlePathChange} type="text" value={state.saveData.path} name="access-path" id="access-path" class="pl-2 flex-1 block w-full min-w-0 rounded-none rounded-r-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="不填写自动生成" />
              </div>
            </div>

            <div>
              <label for="text-type" class="block text-sm font-medium text-gray-600 dark:text-gray-400">文本类型</label>
              <select onChange={handleTypeChange} id="text-type" name="text-type" value={state.saveData.type} class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors">
                <option value="text">Text</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>

          <div class="flex gap-4 items-center justify-center">
            <button disabled={state.done} type="submit" onClick={() => handleSubmit()} class="disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-75 w-[300px] flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200">
              {state.done ? '已生成' : state.saving ? '正在保存...' : (searchParams.path ? '更新内容' : '生成分享链接')}
            </button>

            <Show when={state.done}>
              <svg onClick={reset} width={20} height={20} class="cursor-pointer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" enable-background="new 0 0 512 512"><path d="M433,288.8c-7.7,0-14.3,5.9-14.9,13.6c-6.9,83.1-76.8,147.9-161.8,147.9c-89.5,0-162.4-72.4-162.4-161.4
	c0-87.6,70.6-159.2,158.2-161.4c2.3-0.1,4.1,1.7,4.1,4v50.3c0,12.6,13.9,20.2,24.6,13.5L377,128c10-6.3,10-20.8,0-27.1l-96.1-66.4
	c-10.7-6.7-24.6,0.9-24.6,13.5v45.7c0,2.2-1.7,4-3.9,4C148,99.8,64,184.6,64,288.9C64,394.5,150.1,480,256.3,480
	c100.8,0,183.4-76.7,191.6-175.1C448.7,296.2,441.7,288.8,433,288.8L433,288.8z"></path></svg>
            </Show>
          </div>



          <Show when={state.done}>
            {
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                分享链接：<A href={`/c/${state.saveData.path}`} class="text-indigo-600 dark:text-indigo-400 mr-4">{`/c/${state.saveData.path}`}</A>
                <CopyBtn size={16} color="green" text={textToCopy()} />
              </p>
            }
          </Show>
        </div>
      </div>
    </main>
  );
}
