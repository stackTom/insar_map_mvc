@extends('app')

@section('content')
<div class="container-fluid">
	<table class="table">
		<thead>
			<tr>
				<th>User</th>
				<th>Permissions</th>
			</tr>
		</thead>
		<tbody>
			<?php // might want to sort by name in controller to prevent anyone knowing id's of DB
			$curRow = 0;?>
			@foreach ($userPermissions as $userPermission)
				<tr>
					<td><input type="checkbox" value={{ $userPermission["user"]->id }} name="selected-users">{{ $userPermission["user"]->name }}</td>
					<td>
						<?php
							$permissionsString = "";

							foreach ($userPermission["permissions"] as $permission) {
								$permissionsString = $permissionsString . $permission . " ";
							}

							echo '<input type="text" value="' . $permissionsString . '" id="row-' . $curRow . '"';
						?>
					</td>
					<td>
						<button class="btn btn-primary table-buttons" type="submit" id={{ $curRow }}>Set New Permissions</button>
					</td>
				</tr>
				<?php $curRow++;?>	
			@endforeach
		</tbody>
	</table>
		<button class="btn btn-primary" type="submit" id="add-user-button">Add User</button>
		<button class="btn btn-primary" type="submit" id="remove-user-button">Remove User(s)</button>
</div>
<script type="text/javascript">
	var userPermissions = <?php echo json_encode($userPermissions); ?>;
</script>
<script type="text/javascript" src="/js/adminPanel.js"></script>
@endsection