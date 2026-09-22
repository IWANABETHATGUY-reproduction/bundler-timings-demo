# Rolldown bundler timing demo

This demo shows how `checks.bundlerTimings` reports slow code-splitting callbacks.

Rolldown calls the group label option `debugName`. The option does not change the chunk name.

## Setup

This demo pins the Rolldown preview for commit `6db3aa896` from [pkg.pr.new](https://pkg.pr.new/rolldown@6db3aa896).
The preview includes `rolldown/rolldown#10916`. Version `1.2.9` does not include this feature.

Install the preview package:

```sh
npm install
```

Set `ROLLDOWN_DIST` to test a different local build:

```sh
ROLLDOWN_DIST=/path/to/rolldown/packages/rolldown/dist/index.mjs npm run demo
```

## Run all cases

```sh
npm run demo
```

Each case waits for more than three seconds. This delay makes the diagnostic stable on a small project.

## Slow `group.test`

```sh
npm run demo:slow-test
```

Two groups have slow `test` callbacks and function values for `name`.
Neither group has a `debugName`, so Rolldown warns and uses each group index in the timing rows.

Expected warnings and diagnostic:

```text
`output.codeSplitting.groups[0].name` is a function. Set `output.codeSplitting.groups[0].debugName` so the bundler timing report can identify this group.
`output.codeSplitting.groups[1].name` is a function. Set `output.codeSplitting.groups[1].debugName` so the bundler timing report can identify this group.
[PLUGIN_TIMINGS] JavaScript callbacks ran for 3.4s of this 3.4s build (99%).
The slowest callbacks, timed inside each callback (the wait before a callback starts is excluded, the time it awaits is included):
  - output options codeSplitting groups[1].test (53%, 1.8s, 3 calls)
  - output options codeSplitting groups[0].test (47%, 1.6s, 3 calls)
```

## Slow `group.name`

```sh
npm run demo:slow-name
```

The group has a function for `name` and no `debugName`. Rolldown warns about the missing label.
The timing row uses `groups[0]` to identify the group.

Expected warning and diagnostic:

```text
`output.codeSplitting.groups[0].name` is a function. Set `output.codeSplitting.groups[0].debugName` so the bundler timing report can identify this group.
[PLUGIN_TIMINGS] JavaScript callbacks ran for 3.2s of this 3.2s build (99%).
The slowest callbacks, timed inside each callback (the wait before a callback starts is excluded, the time it awaits is included):
  - output options codeSplitting groups[0].name (99%, 3.2s, 1 call)
```

## Group with `debugName`

```sh
npm run demo:debug-name
```

The same two groups now have `debugName` labels.
Each timing row includes its group index and label.

Expected diagnostic:

```text
[PLUGIN_TIMINGS] JavaScript callbacks ran for 3.4s of this 3.4s build (99%).
The slowest callbacks, timed inside each callback (the wait before a callback starts is excluded, the time it awaits is included):
  - output options codeSplitting groups[1].test "dependency B group" (53%, 1.8s, 3 calls)
  - output options codeSplitting groups[0].test "dependency A group" (47%, 1.6s, 3 calls)
```

The exact times and percentages can change slightly between runs.
