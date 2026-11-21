# Low-poly post for instancing: decimate a copy of the Meshy mesh, give it fresh UVs and bake the original colour onto them.
# blender -b --factory-startup -P bake-low.py -- <in.glb> <out.glb> <ratio> <texture px>
import bpy, sys
argv = sys.argv[sys.argv.index('--')+1:]; src, out, ratio, px = argv[0], argv[1], float(argv[2]), int(argv[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
high = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
bpy.context.view_layer.objects.active = high
bpy.ops.object.select_all(action='DESELECT'); high.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
low = high.copy(); low.data = high.data.copy(); low.name = 'post'; bpy.context.scene.collection.objects.link(low)
bpy.ops.object.select_all(action='DESELECT'); low.select_set(True); bpy.context.view_layer.objects.active = low
# Meshy meshes are split along UV seams; weld them first so decimation does not open holes.
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=max(high.dimensions) * 0.0005); bpy.ops.object.mode_set(mode='OBJECT')
mod = low.modifiers.new('dec', 'DECIMATE'); mod.ratio = ratio; mod.use_collapse_triangulate = True
bpy.ops.object.select_all(action='DESELECT'); low.select_set(True); bpy.context.view_layer.objects.active = low
bpy.ops.object.modifier_apply(modifier='dec')
while low.data.uv_layers: low.data.uv_layers.remove(low.data.uv_layers[0])
low.data.uv_layers.new(name='UVMap')
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.01); bpy.ops.object.mode_set(mode='OBJECT')
img = bpy.data.images.new('post_color', px, px); img.generated_color = (0.55, 0.36, 0.2, 1)
mat = bpy.data.materials.new('post'); mat.use_nodes = True; nt = mat.node_tree
tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
nt.links.new(tex.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
low.data.materials.clear(); low.data.materials.append(mat)
nt.nodes.active = tex
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'
size = max(high.dimensions)
bpy.ops.object.select_all(action='DESELECT'); high.select_set(True); low.select_set(True); bpy.context.view_layer.objects.active = low
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True, cage_extrusion=size * 0.04, max_ray_distance=0, margin=4)
img.filepath_raw = out.replace('.glb', '-color.png'); img.file_format = 'PNG'; img.save()
bpy.data.objects.remove(high)
print('LOWTRIS', sum(len(p.vertices) - 2 for p in low.data.polygons))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_image_format='JPEG', export_jpeg_quality=90)
