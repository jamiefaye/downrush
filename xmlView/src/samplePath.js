var sample_path_prefix = '/';

function setSamplePathPrefix(toPrefix) {
	sample_path_prefix = toPrefix;
}

function getSamplePathPrefix() {
	return sample_path_prefix;
}

export {setSamplePathPrefix, getSamplePathPrefix};