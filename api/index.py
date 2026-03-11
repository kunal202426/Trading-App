import importlib.util
import os
import sys

# Add project root to sys.path so api.py's imports (dynamic_predictor, etc.) resolve correctly
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

# Load api.py by file path — avoids name conflict with this api/ package
_spec = importlib.util.spec_from_file_location("_api_module", os.path.join(_root, "api.py"))
_module = importlib.util.module_from_spec(_spec)
sys.modules["_api_module"] = _module
_spec.loader.exec_module(_module)

app = _module.app
