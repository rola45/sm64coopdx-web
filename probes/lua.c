#include <stdio.h>
#include "lua.h"
#include "lauxlib.h"
int main(void) {
    lua_State *L = luaL_newstate();
    if (!L) return 1;
    if (luaL_dostring(L, "return 6 * 7") != LUA_OK) return 2;
    if (lua_tointeger(L, -1) != 42) return 3;
    lua_getglobal(L, "io");
    if (!lua_isnil(L, -1)) return 4;
    lua_close(L);
    puts("Lua 5.3 WASM arithmetic passed; host IO libraries unopened");
    return 0;
}
