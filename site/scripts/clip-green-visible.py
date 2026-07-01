import json
import sys

from shapely.geometry import GeometryCollection, mapping, shape
from shapely.ops import unary_union

try:
    from shapely import make_valid
except ImportError:
    from shapely.validation import make_valid


MIN_AREA = 1e-12


def load_geojson(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def save_geojson(path, payload):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, separators=(",", ":"))


def valid_geometry(feature):
    geometry = feature.get("geometry")
    if not geometry:
        return None
    try:
        value = make_valid(shape(geometry))
    except Exception:
        return None
    return value if not value.is_empty else None


def polygonal_parts(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    if geometry.geom_type == "MultiPolygon":
        return list(geometry.geoms)
    if geometry.geom_type == "GeometryCollection":
        result = []
        for part in geometry.geoms:
            result.extend(polygonal_parts(part))
        return result
    return []


def main():
    if len(sys.argv) != 4:
        raise SystemExit("Usage: clip-green-visible.py green.geojson quartals.geojson output.geojson")

    green_path, quartals_path, output_path = sys.argv[1:]
    green = load_geojson(green_path)
    quartals = load_geojson(quartals_path)

    quarter_geometries = [
        geometry
        for feature in quartals.get("features", [])
        for geometry in [valid_geometry(feature)]
        if geometry is not None
    ]
    if not quarter_geometries:
        save_geojson(output_path, green)
        return

    mask = unary_union(quarter_geometries)
    output_features = []
    for index, feature in enumerate(green.get("features", [])):
        geometry = valid_geometry(feature)
        if geometry is None:
            continue
        clipped = geometry.difference(mask) if geometry.intersects(mask) else geometry
        parts = [part for part in polygonal_parts(make_valid(clipped)) if part.area > MIN_AREA]
        for part_index, part in enumerate(parts):
            output_features.append({
                "type": "Feature",
                "id": feature.get("id", f"green-{index}-{part_index}"),
                "properties": feature.get("properties") or {},
                "geometry": mapping(part)
            })

    save_geojson(output_path, {
        "type": "FeatureCollection",
        "features": output_features
    })


if __name__ == "__main__":
    main()
