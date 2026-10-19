# python-lib

Python 夹具项目，用于验收仓库理解对 `pyproject.toml`、包目录与测试入口的识别。

## 运行测试

```sh
python -m unittest discover -s tests -v
```

无第三方依赖，使用标准库 `unittest`，要求 Python 3.10+。

## 结构

- `src/suite_py_lib/text.py`：`normalize` 与 `initials` 纯函数。
- `tests/test_text.py`：标准库 unittest 用例。
