#include <assert.h>
#include <stdio.h>
#include "engine/math_util.h"
int main(void) {
    assert(approach_s32(0, 10, 3, 3) == 3);
    assert(approach_s32(9, 10, 3, 3) == 10);
    assert(approach_s32(10, 0, 3, 3) == 7);
    puts("Upstream math_util.c: approach_s32 WASM assertions passed");
    return 0;
}
