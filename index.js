let isMount = true;
let workInProgressHook = null;

const fiber = {
  memoizedState: null, // 链表  保存多个hooks
  stateNode: App
};

function run() {
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  isMount = false;
  return app;
}

// 创建update并形成一个环状链表
function dispatchAction(queue, action) {
  const update = {
    action,
    next: null
  };

  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  run();
}

function useState(initialState) {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        pending: null // 指向最后一个update
      },
      memoizedState: initialState,
      next: null
    };

    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) { // 指向最后一个update
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next);

    hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}

function App() {
  const [num, updateNum] = useState(0);
  const [status, triggerStatus] = useState(false);

  console.log('num: ', num);
  console.log('status: ', status);

  return {
    onClick() {
      updateNum(num => num + 1);
      updateNum(num => num + 1);
      updateNum(num => num + 1);
    },
    trigger() {
      triggerStatus(status => !status);
    }
  };
}

window.app = run();
