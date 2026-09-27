export function createHistory(initial) {
  let stack = [JSON.stringify(initial)];
  let index = 0;

  function push(workflow) {
    const json = JSON.stringify(workflow);
    if (json === stack[index]) return;
    stack = stack.slice(0, index + 1);
    stack.push(json);
    index = stack.length - 1;
  }

  function undo() {
    if (index <= 0) return null;
    index -= 1;
    return JSON.parse(stack[index]);
  }

  function redo() {
    if (index >= stack.length - 1) return null;
    index += 1;
    return JSON.parse(stack[index]);
  }

  function canUndo() {
    return index > 0;
  }

  function canRedo() {
    return index < stack.length - 1;
  }

  function reset(workflow) {
    stack = [JSON.stringify(workflow)];
    index = 0;
  }

  return { push, undo, redo, canUndo, canRedo, reset };
}
