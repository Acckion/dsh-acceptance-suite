# python-lib 约定

- 语言：Python 3.10+，源码位于 `src/suite_py_lib/`。
- 测试：`python -m unittest discover -s tests -v`（在本目录执行），只使用标准库，不引入第三方依赖。
- 测试文件通过 `sys.path` 注入 `src/`，无需安装本包即可运行。
- 修改 `text.py` 中的行为时必须同步更新 `tests/test_text.py`。
